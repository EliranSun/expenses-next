import { CategoriesDropdown } from "../molecules/categories-dropdown";
import { CurrencyAmount } from "./currency-amount";
export const TableRow = ({ rowData = {} }) => {
    return (
        <tr className="bg-gray-100 even:bg-white">
            <td>{rowData.name}</td>
            <td>{rowData.date}</td>
            <td>{rowData.account}</td>
            <td><CurrencyAmount amount={rowData.amount} /></td>
            <td><CategoriesDropdown value={rowData.category} /></td>
            <td>
                <input
                    type="text"
                    className="bg-transparent"
                    defaultValue={rowData.note} /></td>
        </tr>
    );
};