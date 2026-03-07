import { doc,setDoc } from "firebase/firestore"
import { db } from "./firebase"
import { getAuth } from "firebase/auth"

export async function saveUserPreference(data:any){

const auth = getAuth()
const user = auth.currentUser

if(!user) return

await setDoc(doc(db,"user_preferences",user.uid),{

 class:data.class,
 stream:data.stream,
 career:data.career,
 updatedAt:new Date()

})

}