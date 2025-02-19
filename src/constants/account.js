
export const PrivateAccount = [
    "3361",
    "4887",
    "170-489748",
    "500-489746"
];
export const SharedAccount = [
    "9325",
    "754-320766",
];

export const WifeAccount = [];


export const Accounts = {
    private: PrivateAccount,
    shared: SharedAccount,
    wife: WifeAccount,
    all: [
        ...PrivateAccount,
        ...SharedAccount,
        ...WifeAccount
    ],
};