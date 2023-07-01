import { createContext, useEffect, useReducer } from "react";

export const AuthContext = createContext()

export const authReducer = (state, action) =>{
    switch(action.type){
        case "LOGIN":
            return {user: action.payload, isLoading: false}
        case "LOGOUT":
            return {user: null, isLoading: false}
        case "STOP_LOADING":
            return {user: action.payload, isLoading: false}
        default:
            return state
    }
}

export const AuthContextProvider = ({children}) => {
    const [state, dispatch] = useReducer(authReducer, {user: null, isLoading: true})

    useEffect(() =>{
        const user = JSON.parse(localStorage.getItem("user"))

        if(!user){
            dispatch({type: "STOP_LOADING", payload: user})
            return
        }

        // check if JWT token expired, adapted from https://stackoverflow.com/questions/51292406/check-if-token-expired-using-this-jwt-library
        
        const base64Url = user.token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
            .split("")
            .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );

        const { exp } = JSON.parse(jsonPayload);
        const expired = Date.now() >= exp * 1000

        if(expired){
            dispatch({type: "LOGOUT"})
        } else if(user){
            dispatch({type: "LOGIN", payload: user})
        }
    }, [])

    return (
        <AuthContext.Provider value={{...state, dispatch}}>
            { children }
        </AuthContext.Provider>
    );
}