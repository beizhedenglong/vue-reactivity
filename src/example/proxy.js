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


person.age += 1
