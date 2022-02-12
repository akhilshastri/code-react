import { createStore } from "redux";
import {AppReducer} from "./reducer";

export const store = createStore(AppReducer, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
