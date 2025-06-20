import { useEffect } from "react";
import { useDispatch } from "react-redux";
import ThemeStyles from "../../features/theme/ThemeStyles";
import Router from "../../features/router/Router";
import { started } from "./slice";

export function Application() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(started());
  }, [dispatch]);

  return (
    <>
      <ThemeStyles />
      <Router />
    </>
  );
}
