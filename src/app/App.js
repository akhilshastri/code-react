import "./App.css";
import { useDispatch } from "react-redux";
import { SearchPanel } from "./components/SearchPanel";
import { ListPanel } from "./components/ListPanel";
import { useEffect } from "react";
import { initApp } from "./redux/actions";
import { loadData } from "./utils";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    loadData().then((data) => {
      dispatch(
        initApp({
          search: "",
          data,
        })
      );
    });
  }, [dispatch]);

  return (
    <div style={styles.container}>
      <SearchPanel />
      <ListPanel />
    </div>
  );
}

export default App;

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
  },
};
