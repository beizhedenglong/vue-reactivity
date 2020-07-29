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
