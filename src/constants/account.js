export const PrivateAccounts = [
    "3361",
    "4887",
    "8580",
    "1039",
    "170-489748",
    "500-489746",
    "768-489741",
];

export const SharedAccounts = [
    "9325",
    "754-320766",
];

const Private = { name: "private", translation: "פרטי" };
const Shared = { name: "shared", translation: "משותף" };

export const AccountName = {
    "3361": Private,
    "4887": Private,
    "8580": Private,
    "1039": Private,
    "170-489748": Private,
    "500-489746": Private,
    "768-489741": Private,
    "9325": Shared,
    "754-320766": Shared,
}

export const WifeAccount = [];


export const Accounts = {
    private: PrivateAccounts,
    shared: SharedAccounts,
    wife: WifeAccount,
    all: [
        ...PrivateAccounts,
        ...SharedAccounts,
        ...WifeAccount
    ],
};