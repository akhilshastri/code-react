export const initApp = (payload) => {
  return {
    type: "INIT_APP",
    payload,
  };
};

export const searchChanged = (payload) => {
  return {
    type: "SEARCH_CHANGED",
    payload,
  };
};
