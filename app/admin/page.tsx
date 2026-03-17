import { getUsers, getAllWordsAdmin, toggleWordStatus, createToken, deleteUser, addWord } from "@/app/actions";
import { UserPlus, Trash2, Key, Book, CheckCircle, XCircle, Plus } from "lucide-react";

export default async function AdminPage() {
  const users = await getUsers();
  const words = await getAllWordsAdmin();

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="border-b border-white/10 pb-6">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-rose-400 to-orange-400 text-transparent bg-clip-text inline-block">
            Dashboard Admin
          </h1>
          <p className="text-neutral-400 mt-2">Manage your word list and user access keys.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* User Management Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Key className="w-6 h-6 text-rose-500" />
                Access Tokens
              </h2>
            </div>

            <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <form action={async (formData) => {
                "use server";
                const username = formData.get("username") as string;
                const token = formData.get("token") as string;
                await createToken(username, token);
              }} className="p-6 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row gap-4">
                <input 
                  name="username" 
                  placeholder="Username" 
                  className="bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none flex-1"
                  required
                />
                <input 
                  name="token" 
                  placeholder="Token Key" 
                  className="bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none flex-1"
                  required
                />
                <button className="bg-rose-600 hover:bg-rose-500 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Issue
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-neutral-400 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Token</th>
                      <th className="px-6 py-4">Expires</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium">{user.username}</td>
                        <td className="px-6 py-4 text-rose-400 font-mono text-sm">{user.token}</td>
                        <td className="px-6 py-4 text-neutral-400 text-sm">
                          {user.expiresAt.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <form action={async () => {
                            "use server";
                            await deleteUser(user.id);
                          }}>
                            <button className="text-neutral-500 hover:text-red-500 transition-colors p-2">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Word Management Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Book className="w-6 h-6 text-orange-500" />
              Word Repository
            </h2>

            <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
               <form action={async (formData) => {
                  "use server";
                  const word = formData.get("word") as string;
                  await addWord(word);
                }} className="p-6 bg-white/5 border-b border-white/10 flex gap-4">
                <input 
                  name="word" 
                  placeholder="New Indonesian Word" 
                  className="bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none flex-1"
                  required
                />
                <button className="bg-orange-600 hover:bg-orange-500 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </form>

              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-neutral-400 text-sm uppercase tracking-wider sticky top-0">
                      <th className="px-6 py-4">Word</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {words.map((word) => (
                      <tr key={word.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium tracking-wide">
                          {word.word}
                        </td>
                        <td className="px-6 py-4">
                          {word.isActive ? (
                            <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/20">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-neutral-500 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                              <XCircle className="w-3 h-3" />
                              Hidden
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <form action={async () => {
                            "use server";
                            await toggleWordStatus(word.id, word.isActive);
                          }}>
                            <button className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                              word.isActive ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'
                            }`}>
                              {word.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-white/5 text-xs text-neutral-500 text-center">
                Showing top 500 words. Search/filter coming soon.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
