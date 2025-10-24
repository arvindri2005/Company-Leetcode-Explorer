import { db } from "./firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";

export * from "./db/company.data";
export * from "./db/problem.data";
export * from "./db/user.data";

/**
 * @function hasData
 * @description Checks if there is any company and problem data in the Firestore database.
 * This is useful for determining if the initial data seeding process needs to be run.
 * @returns {Promise<{ companies: boolean; problems: boolean; }>} A promise that resolves to an object indicating the presence of company and problem data.
 */
export const hasData = async (): Promise<{
    companies: boolean;
    problems: boolean;
}> => {
    try {
        console.log("Fetching companies snapshot from Firestore...");
        const companiesSnap = await getDocs(
            query(collection(db, "companies"), limit(1))
        );
        let problemsExist = false;
        if (!companiesSnap.empty) {
            const firstCompanyId = companiesSnap.docs[0].id;
            console.log(
                `Fetching problems snapshot for company ${firstCompanyId} from Firestore...`
            );
            const problemsSnap = await getDocs(
                query(
                    collection(db, "companies", firstCompanyId, "problems"),
                    limit(1)
                )
            );
            problemsExist = !problemsSnap.empty;
        }
        return { companies: !companiesSnap.empty, problems: problemsExist };
    } catch (error) {
        console.error("Error checking for data presence: ", error);
        return { companies: false, problems: false };
    }
};
