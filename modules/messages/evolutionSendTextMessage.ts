import { JsonObject } from "@prisma/client/runtime/client";

export const sendTextMessage = async(clientNumber: string,message:string,instance_name:string):Promise<any>=>{
    try{
        const response = await fetch(`http://72.61.110.16:8080/message/sendText/${instance_name}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "apikey": "sajed2026Evo"
            },
            body:JSON.stringify({
                "number": clientNumber ,
                "text": message

            })
        })
        return await response.json()
    }
    catch(error){
        console.error("Error sending text message:", error);
        return null;
    }
  }