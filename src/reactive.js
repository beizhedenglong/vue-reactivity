/* eslint-disable no-underscore-dangle */

const targetMap = new Map()
const effectStack = []


const reactive = (target = {}) => {
  const observed = new Proxy(target, {
    get: (obj, key, receiver) => {
      const effect = effectStack[effectStack.length - 1]
      const depsMap = targetMap.get(obj) || new Map()

      targetMap.set(target, depsMap)
      const dep = depsMap.get(key) || new Set([])

      depsMap.set(key, dep)

      if (effect && !dep.has(effect)) {
        dep.add(effect)
      }
      const res = Reflect.get(obj, key, receiver)
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

const effect = (fn) => {
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

const person = reactive({
  age: 123,
  name: 'Victor',
})

const p = document.createElement('p')
document.body.appendChild(p)
effect(() => {
  console.log(person)
  p.innerHTML = person.age + person.name
})

// effect(() => {
//   console.log(person.name)
// })

setInterval(() => {
  person.age += 1
  person.name += 'r'
}, 1000)
