'use client';

import { toast } from 'sonner';

export async function run(actionPromise, { success } = {}) {
    const res = await actionPromise;
    if (!res?.ok) {
        toast.error(res?.error ?? 'Something went wrong');
    } else if (success) {
        toast.success(success);
    }
    return res;
}
