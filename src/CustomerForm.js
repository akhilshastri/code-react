import './App.css';
import {useState} from "react";




function CustomerForm(props) {
  const [name,setName] = useState('')
  return (
    <div>
      Name :  <input value={name}  onChange={
      (e) => {
        setName(e.currentTarget.value)
      }
    }/>

      <button onClick={()=>props.onSave(name)}>
          Submit
      </button>
    </div>
  );

}

export default CustomerForm;
