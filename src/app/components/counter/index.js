import {Display} from "./Display";
import {Button} from "./Button";
import {useDispatch, useSelector} from "react-redux";

export const Counter = () => {
    const dispatch = useDispatch();
    const count = useSelector(state => state)

    const increase=()=>{
        dispatch({type: 'INCREMENT'})
    }

    return (<>
      <Display>Display {count} </Display>

      <Button text={"+"} onClick={increase} />
      <Button text={"-"} />
    </>);
};
