export const AppReducer = (state = {}, action) => {
  switch (action.type) {
    case "INIT_APP": {
      return {
        ...state,
        ...action.payload,
      };
    }
    case "SEARCH_CHANGED": {
      return {
        ...state,
        search: action.payload,
      };
    }
  }

  return state;
};
