
const { createStore } = require('redux');

function counterReducer(state = 0, action) {
    switch (action.type) {
        case 'INCREMENT':
            return state + 1 ;
        case 'DECREMENT':
            return state -1
        default:
            return state
    }
}

const store = createStore(counterReducer);

//
store.subscribe(() => console.log('STORE UPDATED :' , store.getState()));
//

store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'DECREMENT' });


console.log('FINAL STORE STATE :' + store.getState());
