# 一起动手造轮子：@vue/reactivity

今天和大家一起分析一下 Vue 3.0 中响应式的基本原理及实现，希望通过本次分享具有自己动手实现一个简单响应式库的能力！

## 什么是响应式？
举一个通俗的例子，我们平时在用Numbers 或者 Excel 之类的软件求和时，我们在更改某些单元格中的数据时，总数单元格会自动更细。这就可以理解为响应式，总数单元格会随着依赖的单元格变化而变化。这种特性可以帮助我们高效的开发UI，我们只需关注数据的变化。在了解 vue 响应式原理之前，我们先通过一个🌰来了解一下这个 `@vue/reactivity` 这个库的使用以及它的表现。


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
我们这里主要看两个API：effect 和 reactive。从上面的例子我们可以看到这两个 API 的一些行为，reactive 接收一个对象会返回一个响应的像。ageEffect 和 nameEffect 会被立即执行一次，然后每当我们改变 age 时，ageEffect 就会被执行，而 nameEffect 不会被执行。这是我们从上面的例子中观察到的一些行为。大家可以自己先想一下我们通过什么样的办法可以实现上面的效果。

在了解 @vue/reactivity 的实现方式之前，我们需要先了解一下 Proxy API, @vue/reactivity 依赖 Proxy 提供的一些特性来实现上面我们观察到的效果。


## Proxy


## 其他
增删 数组 edge cases 错误处理，这里就牵扯到很多细节问题了，大家自己去翻它的源码吧。