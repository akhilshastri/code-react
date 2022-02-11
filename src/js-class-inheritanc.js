class Animal{
    sound = 'default' ;
    makeSound(){
        console.log(this.sound);
    }
}
class Dog extends Animal{
    sound = 'Bark';
}
class Cat extends Animal{
    sound = 'Meow';
}

const d = new Dog();
d.makeSound();
const c = new Cat();
c.makeSound();

