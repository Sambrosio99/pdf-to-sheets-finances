
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Transaction } from "@/types/finance";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PDFUploaderProps {
  onDataExtracted: (transactions: Omit<Transaction, 'id'>[]) => void;
}

export const PDFUploader = ({ onDataExtracted }: PDFUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Função simulada para extrair dados do PDF
  const extractDataFromPDF = async (file: File): Promise<Omit<Transaction, 'id'>[]> => {
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Dados simulados extraídos do PDF
    const mockTransactions: Omit<Transaction, 'id'>[] = [
      {
        date: '2024-01-15',
        description: `Compra Supermercado - ${file.name}`,
        category: 'Alimentação',
        paymentMethod: 'Cartão de Crédito',
        amount: 125.80,
        type: 'expense',
        status: 'paid'
      },
      {
        date: '2024-01-16',
        description: `Pagamento Salário - ${file.name}`,
        category: 'Outros',
        paymentMethod: 'Transferência',
        amount: 3500.00,
        type: 'income',
        status: 'paid'
      },
      {
        date: '2024-01-17',
        description: `Conta de Luz - ${file.name}`,
        category: 'Moradia',
        paymentMethod: 'Boleto',
        amount: 87.45,
        type: 'expense',
        status: 'paid'
      }
    ];
    
    return mockTransactions;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const allTransactions: Omit<Transaction, 'id'>[] = [];
      
      for (const file of Array.from(files)) {
        if (file.type !== 'application/pdf') {
          toast.error(`${file.name} não é um arquivo PDF válido`);
          continue;
        }

        toast.info(`Processando ${file.name}...`);
        
        const transactions = await extractDataFromPDF(file);
        allTransactions.push(...transactions);
        
        setUploadedFiles(prev => [...prev, file.name]);
        toast.success(`${file.name} processado com sucesso! ${transactions.length} transações encontradas.`);
      }

      if (allTransactions.length > 0) {
        onDataExtracted(allTransactions);
        toast.success(`Total: ${allTransactions.length} transações adicionadas ao sistema!`);
      }
      
    } catch (error) {
      toast.error("Erro ao processar os arquivos PDF");
      console.error(error);
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-teal-700">📄 Upload de PDFs</CardTitle>
          <CardDescription>
            Faça upload dos seus extratos em PDF para extração automática dos dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Área de Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                Arraste seus PDFs aqui ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500">
                Suporta múltiplos arquivos PDF (máx. 10MB cada)
              </p>
            </div>
            
            <Input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
              disabled={isUploading}
              className="mt-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>

          {/* Status do Upload */}
          {isUploading && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Processando...</strong> Aguarde enquanto extraímos os dados dos seus PDFs.
              </AlertDescription>
            </Alert>
          )}

          {/* Arquivos Processados */}
          {uploadedFiles.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Arquivos Processados com Sucesso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadedFiles.map((fileName, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                      <FileText className="h-4 w-4" />
                      <span>{fileName}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Como funciona:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Faça upload dos seus extratos bancários em PDF</li>
                <li>• O sistema extrairá automaticamente as transações</li>
                <li>• Os dados serão organizados e adicionados às suas finanças</li>
                <li>• Você pode revisar e editar as informações depois</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Instruções de Uso */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-indigo-700">💡 Dicas para Melhores Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-indigo-800 mb-2">Formatos Aceitos:</h4>
              <ul className="space-y-1 text-indigo-700">
                <li>• Extratos bancários em PDF</li>
                <li>• Faturas de cartão de crédito</li>
                <li>• Comprovantes de pagamento</li>
                <li>• Relatórios financeiros</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-indigo-800 mb-2">Para Melhor Precisão:</h4>
              <ul className="space-y-1 text-indigo-700">
                <li>• Use PDFs com texto selecionável</li>
                <li>• Evite documentos escaneados de baixa qualidade</li>
                <li>• Mantenha o formato original do banco</li>
                <li>• Verifique os dados após a importação</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
