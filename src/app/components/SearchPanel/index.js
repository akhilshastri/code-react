import { searchChanged } from "../../redux/actions";
import { useDispatch, useSelector } from "react-redux";

const selectSearch = (state) => state.search;
export const SearchPanel = () => {
  const input = useSelector(selectSearch);

  const dispatch = useDispatch();

  const submit = (e) => {
    e.preventDefault();
    dispatch(searchChanged(input));
  };

  const onInputChanged = (e) => {
    const inputValue = e.currentTarget.value;
    dispatch(searchChanged(inputValue));
  };

  return (
    <form onSubmit={submit}>
      <input
        placeholder="Enter text to search"
        value={input}
        onChange={onInputChanged}
      />
      <button type="submit">Search</button>
    </form>
  );
};
