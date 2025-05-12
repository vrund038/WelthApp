"use server"

import { db } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { Select } from "@radix-ui/react-select"
import { revalidatePath } from "next/cache"
import { use } from "react"
import { date } from "zod"


const serializeTransaction = (obj) => {
    const serialized = {...obj};

    if(obj.balance){
        serialized.balance = obj.balance.toNumber();
    }
    
    if(obj.amount){
        serialized.amount = obj.amount.toNumber();
    }


    return serialized;
}

export async function createAccount(data){
    try {
        const {userId} = await auth()
         
        if(!userId) throw new Error("Unauthorized")
         
        const user = await db.user.findUnique({
            where : { clerkUserId: userId},
        })

        if (!user){
            throw new Error("User not found")
        }


        //convert balance into float

        const balanceFloat = parseFloat(data.balance)

        if(isNaN(balanceFloat)){
            throw new Error("Invalid balance amount")
        }


        //check if this is user's first account

        const existingAccounts = await db.account.findMany({
            where : {userId:user.id},
        })


        const shouldBeDefault = existingAccounts.length === 0 ? true : data.isDefault;
        //means if existing account function did't find any other account for this so that account become default otherwise user provide is default true



        //If this default other should be unset
        if(shouldBeDefault){
            await db.account.updateMany({
                where: {userId : user.id, isDefault: true},
                data: { isDefault : false}
            })
        }


        const account = await db.account.create({
            data:{
                ...data,
                balance:balanceFloat,
                userId:user.id,
                isDefault:shouldBeDefault,
            },
        })

        const serializedAccount = serializeTransaction(account);

        revalidatePath("/dashboard") 
        //if new user then again load all 

        return { success:true , data:serializedAccount };
    } catch (error) {
        throw new Error(error.message);
    }
}


export async function getUserAccounts() {
    const {userId} = await auth()
         
    if(!userId) throw new Error("Unauthorized")
     
    const user = await db.user.findUnique({
        where : { clerkUserId: userId},
    })

    if (!user){
        throw new Error("User not found")
    }


    const accounts = await db.account.findMany({
        where : { userId: user.id},
        orderBy: { createdAt: "desc" },
        include:{
            _count:{
                select:{
                    transactions: true,
                }
            }
        }
    })

    const serializedAccount = accounts.map(serializeTransaction)


    return serializedAccount;
}



export async function getDashboardData(){
    const {userId} = await auth()
         
    if(!userId) throw new Error("Unauthorized")
     
    const user = await db.user.findUnique({
        where : { clerkUserId: userId},
    })

    if (!user){
        throw new Error("User not found")
    }


    //get all user transactions
    const transactions = await db.transaction.findMany({
        where:{userId:user.id},
        orderBy:{date:"desc"},    
    })

    return transactions.map(serializeTransaction);
}