import './App.css';
import {Counter} from "./components/counter";



function App() { // <=


  return (<div style={styles.container}>
            <Counter/>
      </div>
  );
}

export default App;


const styles = {
    container:{
        display: "flex",
        "alignItems": "center",
        "flexDirection": "column"
    }
}
