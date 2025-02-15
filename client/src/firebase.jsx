import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {GoogleAuthProvider,getAuth,signInWithPopup,signOut} from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyAk2G6c-tJK8BLuhQO3t4QjhHXaWWr8JV0",
  authDomain: "turf-booking-system-16212.firebaseapp.com",
  projectId: "turf-booking-system-16212",
  storageBucket: "turf-booking-system-16212.firebasestorage.app",
  messagingSenderId: "726264214235",
  appId: "1:726264214235:web:603e936cfd5eda563852fe",
  measurementId: "G-5F0X081FWC"
};

const app = initializeApp(firebaseConfig);
const auth=getAuth(app);
const db = getFirestore(app);
const googleprovider=new GoogleAuthProvider();
const signInwithGoogle=async()=>{
    try{
        const result=await signInWithPopup(auth,googleprovider);
        const user=result.user;
        console.log(result);
    }
    catch(error){
        console.log(error);
        alert(error.message);
    }
    }
    const logout=()=>{
        signOut(auth);
    }
export {app,auth,db,signInwithGoogle,logout};
// const analytics = getAnalytics(app);