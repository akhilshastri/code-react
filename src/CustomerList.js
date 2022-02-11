import './App.css';




function CustomerList(props) { // <=

  const customers = props.data;

  return (
    <ul>
        { customers.map(cust=>{
            return <li key={cust.name}> {cust.id} | {cust.name} </li>
        }) }

    </ul>
  );

}

export default CustomerList;
