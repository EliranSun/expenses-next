import { neon } from '@neondatabase/serverless';
import { parseTextToRows } from "@/utils";
import Table from "@/components/organisms/table";

export default async function Home() {
  // Connect to the Neon database
  const sql = neon(`${process.env.DATABASE_URL}`);
  // const expenses = formData.get('expenses');

  // console.log(expenses);
  // Insert the comment from the form into the Postgres database

  // await sql('INSERT INTO expenses (name, amount, date, category, id) VALUES ($1, $2, $3, $4, $5)', [
  //   "test",
  //   100,
  //   "2024-01-01",
  //   "test",
  //   crypto.randomUUID()
  // ]);

  // const result = await sql('SELECT name, amount, date, category, id FROM expenses');

  // console.log(result);


  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <textarea
          className='border'
          name="expenses" />
        <Table rowData={parseTextToRows()} />
      </main>
    </div>
  );
}
