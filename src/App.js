import './App.css';
import CustomerList from "./CustomerList";
import {getData} from "./util";
import {useEffect, useState} from "react";
import CustomerForm from "./CustomerForm";





function App() { // <=
    const [customers, setCustomers] = useState([]);

    function saveForm(customer){
        alert('form saved' + customer);

        setCustomers([
            ...customers
            ,{
                "id": customers.length+1,
                "name":customer
            }
        ])
    }

    useEffect(()=>{
        getData().then(data=>{
            setCustomers(data) // <=
        })
    },[])

  return (<>
   <CustomerList data={customers} app/>
   <CustomerList data={customers}/>
   <CustomerList data={customers}/>
   <CustomerForm onSave={saveForm}/>
      </>
  );
}

export default App;
