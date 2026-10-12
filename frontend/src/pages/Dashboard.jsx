import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Appbar } from "../components/Appbar"
import { Balance } from "../components/Balance"
import { Users } from "../components/Users"

export const Dashboard = () => {
    const [balance, setBalance] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("http://localhost:3000/api/v1/account/balance", {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        })
            .then(response => setBalance(response.data.balance))
            .catch(() => navigate("/signin"))
    }, [navigate])

    return <div>
        <Appbar />
        <div className="m-8">
            <Balance value={balance === null ? "..." : balance.toFixed(2)} />
            <Users />
        </div>
    </div>
}
