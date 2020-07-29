import {reactive, effect} from "../reactive"

const person = reactive({
  age: 123,
  name: 'Victor',
  obj: {
    count: 1,
  },
})

const p = document.createElement('p')
document.body.appendChild(p)
effect(() => {
  p.innerHTML = person.obj.count
})

// effect(() => {
//   console.log(person.name)
// })

setInterval(() => {
  person.age += 1
  person.name += 'r'
  person.obj.count += 1
}, 1000)
