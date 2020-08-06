/* eslint-disable no-underscore-dangle */

const targetMap = new Map()
const effectStack = []

const isPlainObj = x => typeof x === 'object' && x !== null

export const reactive = (target = {}) => {
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
      if (isPlainObj(res)) {
        return reactive(res)
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
    if (effectStack.indexOf(_effect) === -1) {
      effectStack.push(_effect)
      fn(...args)
      effectStack.pop()
    }
  }
  _effect()
  return _effect
}
