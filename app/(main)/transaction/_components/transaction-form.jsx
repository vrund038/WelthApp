"use client"

import { createTransaction, updateTransaction } from '@/actions/transaction'
import CreateAccountDrawer from '@/components/createaccountdrawer'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import usefetch from '@/hooks/use-fetch'
import { transactionSchema } from '@/lib/schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import RecieptScanner from './reciept-scanner'

const AddTransactionForm = ({accounts,categories,editMode=false,initialData=null}) => {
    const router= useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get("edit")

    const {register,setValue,handleSubmit,formState:{errors},watch,getValues,reset} = useForm({
        resolver:zodResolver(transactionSchema),
        defaultValues:
        editMode && initialData ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description,
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
              recurringInterval: initialData.recurringInterval,
            }),
        } 
          :
        {
            type:"EXPENSE",
            amount:"",
            category:"",
            description:"",
            accountId:accounts.find((ac) => ac.isDefault)?.id,
            date:new Date(),
            iSRecurring:false,
        }
    });

    const {
        loading : transactionLoading,
        fn:transactionFn,
        data:transactionResult,
    }= usefetch (editMode ? updateTransaction : createTransaction)
    

    const type = watch("type");
    const iSRecurring = watch("iSRecurring");
    const date = watch("date");

    const onSubmit=async(data) =>{
        const formData = {
            ...data,
            amount:parseFloat(data.amount),
        }
        if(editMode){
            transactionFn(editId,formData);
        }

        else{
            transactionFn(formData)
        }
    };

    useEffect(()=>{
        if(transactionResult?.success && !transactionLoading){
            toast.success(editMode?"Transaction Updated Successfully" : "Transaction Created Successfully")
            reset();
            router.push(`/account/${transactionResult.data.accountId}`);
        }
    },[transactionResult,transactionLoading,editMode])

    const filteredCategories = categories.filter(
        (category) => category.type === type
    )

    const handleScanComplete = (scannedData) => {
        // console.log(scannedData);
        
        if (scannedData) {
          setValue("amount", scannedData.amount.toString());
          setValue("date", new Date(scannedData.date));
          if (scannedData.description) {
            setValue("description", scannedData.description);
          }
          console.log(scannedData.category)
          if (scannedData.category) {
            setValue("category", scannedData.category.charAt(0).toUpperCase() + scannedData.category.slice(1).toLowerCase());

          }
          toast.success("Receipt scanned successfully");
        }
      };

    return (
    <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
        {/* AI Scanner  */}
        {!editMode && <RecieptScanner onScanComplete={handleScanComplete} />}

        <div className='space-y-2'>
            <label className='text-sm font-medium'>Type</label>

            <Select 
                onValueChange={(value) => setValue("type",value)}
                defaultValue={type}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="EXPENSE">EXPENSE</SelectItem>
                    <SelectItem value="INCOME">INCOME</SelectItem>
                </SelectContent>
            </Select>

            {errors.type && (
                <p className='text-sm text-red-500'>{errors.type.message}</p>
            )}
        </div>


         {/* Account and Amount */}

        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("amount")}
            />
            {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
            </div>

            <div className="space-y-2">
            <label className="text-sm font-medium">Account</label>
            <Select
                onValueChange={(value) => setValue("accountId", value)}
                defaultValue={getValues("accountId")}
            >
                <SelectTrigger>
                <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                    {account.name} (${parseFloat(account.balance).toFixed(2)})
                    </SelectItem>
                ))}
                <CreateAccountDrawer>
                    <Button
                    variant="ghost"
                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    >
                    Create Account
                    </Button>
                </CreateAccountDrawer>
                </SelectContent>
            </Select>
            {errors.accountId && (
                <p className="text-sm text-red-500">{errors.accountId.message}</p>
            )}
            </div>
      </div>  

      {/* category  */}

        <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select
                onValueChange={(value) => setValue("category", value)}
                defaultValue={getValues("category")}
            >
                <SelectTrigger>
                <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                    {category.name} 
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
        </div>     

        {/* Date  */}

        <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full pl-3 text-left font-normal">
                            {date ? format(date,"PPP") : <span>Pick a date</span> }
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => setValue("date", date)}
                        disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
        </div>     

        <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input placeholder="Enter  description" {...register("description")}/>

            {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
        </div>   

        
        <div className='flex item-center justify-between rounded-lg border p-3'>
            <div className='space-y-0.5'>
                    <label htmlFor="isDefault" className='text-sm font-medium cursor-pointer'>Recurring Transaction</label>

                    <p className='text-sm text-muted-foreground'>Set up a recurring schedule for this transaction</p> 
            </div>

                <Switch 
                    checked={iSRecurring}
                    onCheckedChange={(checked) => setValue("iSRecurring",checked)}
                />
        </div>  

        {iSRecurring && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Recurring Interval</label>
          <Select
            onValueChange={(value) => setValue("recurringInterval", value)}
            defaultValue={getValues("recurringInterval")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-sm text-red-500">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}

      <div className='flex gap-4'>
        <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={()=>router.back()}
        >Cancel</Button>
         <Button type="submit" className="w-full" disabled={transactionLoading}>
          {transactionLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editMode ? "Updating..." : "Creating..."}
            </>
          ) : editMode ? (
            "Update Transaction"
          ) : (
            "Create Transaction"
          )}
        </Button>
      </div>
    </form>
  ) 
}

export default AddTransactionForm
