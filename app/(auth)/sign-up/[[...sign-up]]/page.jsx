import { SignUp } from '@clerk/nextjs'
import React from 'react'


//The file name start from lower case to make route
//put inside square brackets because catch all route come after sign-in
const Page = () => {
  return (
    <SignUp/>
  )
}

export default Page
