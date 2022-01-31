import './App.css';
import {useEffect, useState} from "react";

function App() { // <=

 const [display , setDisplay] = useState(0) ; // => [1st el, 2 elemnet]


    useEffect(()=>{
        const clenupId =  setInterval(()=>{
            setDisplay( display + 1  );
            console.log(display);
        }, 1000) ;

        return ()=>clearInterval(clenupId) ;
    },[display]);

  return (
    <div className="App">
      counter : { display }
    </div>
  );

}

export default App;
