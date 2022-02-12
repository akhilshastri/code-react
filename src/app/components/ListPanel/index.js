//https://kentcdodds.com/blog/understanding-reacts-key-prop

import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

const selectSearch = (state) => state.search;
const selectData = (state) => state.data;

export const ListPanel = () => {
  const search = useSelector(selectSearch);
  const data = useSelector(selectData);
  const [list, setList] = useState([]);

  useEffect(() => {
    if (!data) return;

    if (search) {
      const filteredData = data.filter(
        (i) => i.name.toLowerCase().indexOf(search.toLowerCase()) > -1
      );
      setList(filteredData);
    } else {
      setList(data);
    }
  }, [search, data]);

  return (
    <>
      <ul>
        {list.map((itm) => (
          <li key={itm.ID}>{itm.name}</li>
        ))}
      </ul>
    </>
  );
};
