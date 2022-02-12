import {Display} from "./Display";
import {Button} from "./Button";


export const Counter = ()=>{

    return <>
        <Display>
            Display
        </Display>

        <Button text={'+'}/>
        <Button text={'-'}/>
    </>
}

