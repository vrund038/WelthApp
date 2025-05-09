import { Suspense } from "react"
import DashboardPage from "./page"
import { BarLoader } from "react-spinners"


const Dashboardlayout = () => {
  return (
    <div>
      <h1 className='text-6xl font-bold gradient-title'>DashBoard</h1>


      <Suspense fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea"/>}>  {/* suspense show loading when we call data */}
        <DashboardPage/>
      </Suspense>
    </div>
  )
}

export default Dashboardlayout
