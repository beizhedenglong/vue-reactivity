# 一起动手造轮子：@vue/reactivity

今天和大家一起分析一下 Vue 3.0 中响应式的基本原理及实现，希望通过本次分享使大家能够具有自己动手实现一个简单响应式库的能力！文章用到的例子在[这里](https://github.com/beizhedenglong/vue-reactivity)，感兴趣的可以 clone 下来跑一跑！

## 什么是响应式？
举一个通俗的例子，我们平时在用Numbers 或者 Excel 之类的软件求和时，我们在更改某些单元格中的数据时，总数单元格会自动更细。这就可以理解为响应式，总数单元格会随着依赖的单元格变化而变化。这种特性可以帮助我们高效的开发UI，我们只需关注数据的变化，不用太多的关注UI更新的细节。在了解 vue 响应式原理之前，我们先通过一个🌰来了解一下 `@vue/reactivity` 这个库的使用以及它的表现。


## `@vue/reactivity` 的使用
`@vue/reactivity` 这个库是不依赖 Vue 的，可以单独使用，你可以在 React 以及其他 JS 项目中使用这个库。下面我们来看一个🌰：
```js
import { reactive, effect } from '@vue/reactivity'

const person = reactive({
  age: 123,
  name: 'Victor',
})

const p = document.createElement('p')
document.body.appendChild(p)

const ageEffect = effect(() => {
  p.innerHTML = person.age
})

const nameEffect = effect(() => {
  console.log(person.name)
})

setInterval(() => {
  person.age += 1
}, 1000)

```
我们这里主要看两个API：effect 和 reactive。从上面的例子我们可以看到这两个 API 的一些行为，reactive 接收一个对象会返回一个响应式的对象。ageEffect 和 nameEffect 会被立即执行一次，然后每当我们改变 age 时，ageEffect 就会被执行，而 nameEffect 不会被执行。这是我们从上面的例子中观察到的一些行为。大家可以自己先想一下我们通过什么样的办法可以实现上面的效果。

在了解 @vue/reactivity 的实现方式之前，我们需要先了解一下 Proxy API, @vue/reactivity 依赖 Proxy 提供的一些特性来实现上面我们观察到的效果。


## Proxy
Proxy 可以为其他的对象创建代理，我们读取或者更新该对象的某些属性时，可以通过 Proxy 来实现一些自定义行为。比如我们可以在读取或者更新属性时打印相应的值:
```js
const person = new Proxy({
  name: 'Victor', age: 1,
}, {
  get(target, key, receiver) {
    const value = Reflect.get(target, key, receiver)
    console.log('get', key, value)
    return value
  },
  set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver)
    console.log('set', key, value)
    return res
  },
})


person.age = person.age + 1
```
在上面的例子中会分别触发一次 age 属性的 set 和 get 代理，打印相应的信息。

有了 Proxy 的前置知识以后，我们就可以一起动手来实现一个响应式库。

## 实现一个简单的响应式库
我们这里主要是实现 reactive 和 effect 这两个 API，我们先来看看我们的输入，确定怎样去存储我们的输入信息。 reactive 输入一个 target, 也就是我们的数据，effect 输入一个函数fn，当 fn 里使用的某些 target 属性更新时，fn 就会被调用。我们这里可以想到 effect 的输入 fn 以及 reactive 的输入 target 应该是通过某种方式联系起来的，每当 target 的 key 更新时，我去执行与这些 key 相关的 effect 函数就可以了。我们可以用一个 Map 来存储这些信息：
```js
depsMap = Map {
  age => Set {ageEffect, ...},
  name => Set {nameEffect, ...}
}
```
我们这里可以考略下为什么用 set 去存储 effect 函数，set 查询的时间复杂是 log(n)，像数组的话查询的时间复杂度是 O(n)，在做框架/库的时候，我们需要考虑性能，考虑一些极端输入。

现在我们有了 depsMap， 那么 depsMap 和我们的 target 是什么关系呢？我们也可以用一个 Map, 把 target 和它对应的 depsMap 存起来。为了更高效的利用内存，我们这里可以用 WeakMap:
```js
  targetMap = WeakMap {
    person => Map {
      age => Set {ageEffect, ...},
      name => Set {nameEffect, ...}
    }
  }
```
好了，我们现在可以用一个全局的 targetMap 来存储所有输入的target，以及 target 的每个 key 所对应的 effect 函数。知道了这些以后，结合 proxy 我们来看看这些信息是如何被收集起来的。

当调用 reactive(target) 时, 我们会做一些初始化操作，在 target 上设置 get/set 等的 proxy，把 target 初始化信息存到 targetMap 里，调用 effect 时，effect 里的函数 fn 会立即调用一次，这样 fn 里用到了 target 里的某些 key 话，就会触发 target 的 get proxy, 我们就可以把 effect 保存到 depsMap 相应的 key 里。
具体的我们来看看代码：

```js

const targetMap = new Map()
const effectStack = []

const isPlainObj = x => typeof x === 'object' && x !== null

export const reactive = (target = {}) => {
  const observed = new Proxy(target, {
    get: (obj, key, receiver) => {
      const effect = effectStack[effectStack.length - 1] // active effect
      const depsMap = targetMap.get(obj) || new Map()

      targetMap.set(target, depsMap)
      const dep = depsMap.get(key) || new Set([])

      depsMap.set(key, dep)

      if (effect && !dep.has(effect)) {
        dep.add(effect)
      }
      const res = Reflect.get(obj, key, receiver)
      if (isPlainObj(res)) {
        return reactive(res) // 注意这里的递归
      }
      return res
    },
    set: (obj, key, value, receiver) => {
      const res = Reflect.set(obj, key, value, receiver)
      const depsMap = targetMap.get(obj)
      if (depsMap) {
        const dep = depsMap.get(key)
        dep.forEach(f => f())
      }
      return res
    },
  })
  return observed
}

export const effect = (fn) => {
  const _effect = (...args) => {
    if (effectStack.indexOf(fn) === -1) {
      effectStack.push(_effect)
      fn(...args)
      effectStack.pop()
    }
  }
  _effect()
  return _effect
}

```
到这里我们明白了 @vue/reactivity 的基本原理，实现了一个简单的响应式库。有些情况比如增删 key、输入是数组或者其它数据结构，我们这里没做处理，大家可以去看源码，都是一些细节问题了。感兴趣的同学还可以和 Redux、Mobx 等库的原理和实现对比下，可以学到一些不同的设计理念。