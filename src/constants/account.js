export const PrivateAccounts = [
    "3361",
    "4887",
    "8580",
    "1039",
    "170-489748",
    "500-489746",
    "768-489741",
];

export const SharedAccount = [
    "9325",
    "754-320766",
];

export const WifeAccount = [];


export const Accounts = {
    private: PrivateAccounts,
    shared: SharedAccount,
    wife: WifeAccount,
    all: [
        ...PrivateAccounts,
        ...SharedAccount,
        ...WifeAccount
    ],
};