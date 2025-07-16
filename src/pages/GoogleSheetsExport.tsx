
import { GoogleSheetsIntegration } from "@/components/export/GoogleSheetsIntegration";
import { useTransactions } from "@/hooks/useTransactions";
import { Loader2 } from "lucide-react";

export default function GoogleSheetsExport() {
  const { transactions, loading } = useTransactions();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-gray-600">Carregando seus dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Exportação para Google Sheets
          </h1>
          <p className="text-gray-600">
            Transforme todos os seus dados financeiros em uma planilha interativa e automatizada
          </p>
        </div>

        <GoogleSheetsIntegration transactions={transactions} />
      </div>
    </div>
  );
}
