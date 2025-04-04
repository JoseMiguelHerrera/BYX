import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const DEBANK_API_KEY = process.env.DEBANK_API_KEY;
if (!DEBANK_API_KEY) {
  throw new Error("DEBANK_API_KEY is not set");
}


export async function getAllUserTokenList(userAddress: string) {
    console.log('getAllUserTokenList', userAddress)

    if (!userAddress) {
        return [];
    }
    const response = await axios.get(
        `https://pro-openapi.debank.com/v1/user/all_token_list?id=${userAddress}&is_all=true`,
        {
            headers: {
                'AccessKey': DEBANK_API_KEY
            }
        }
    );
    return response.data;
}
