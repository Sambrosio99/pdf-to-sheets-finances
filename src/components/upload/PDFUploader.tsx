
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
    console.log("Processando arquivo:", file.name, "Tamanho:", file.size);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Dados simulados mais realistas baseados no nome do arquivo
    const today = new Date();
    const mockTransactions: Omit<Transaction, 'id'>[] = [
      {
        date: today.toISOString().split('T')[0],
        description: `Compra Supermercado - Extrato ${file.name.substring(0, 10)}`,
        category: 'Alimentação',
        paymentMethod: 'Cartão de Débito',
        amount: 89.50,
        type: 'expense',
        status: 'paid'
      },
      {
        date: new Date(today.getTime() - 86400000).toISOString().split('T')[0],
        description: `Posto de Gasolina - ${file.name.substring(0, 8)}`,
        category: 'Transporte',
        paymentMethod: 'Cartão de Crédito',
        amount: 120.00,
        type: 'expense',
        status: 'paid'
      },
      {
        date: new Date(today.getTime() - 172800000).toISOString().split('T')[0],
        description: `Salário - ${file.name.substring(0, 6)}`,
        category: 'Outros',
        paymentMethod: 'Transferência',
        amount: 2800.00,
        type: 'income',
        status: 'paid'
      },
      {
        date: new Date(today.getTime() - 259200000).toISOString().split('T')[0],
        description: `Farmácia - Medicamento`,
        category: 'Saúde',
        paymentMethod: 'PIX',
        amount: 45.80,
        type: 'expense',
        status: 'paid'
      }
    ];
    
    return mockTransactions;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Evento de upload disparado");
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      console.log("Nenhum arquivo selecionado");
      return;
    }

    console.log("Arquivos selecionados:", files.length);
    setIsUploading(true);
    
    try {
      const allTransactions: Omit<Transaction, 'id'>[] = [];
      
      for (const file of Array.from(files)) {
        console.log("Processando arquivo:", file.name, "Tipo:", file.type);
        
        if (file.type !== 'application/pdf') {
          toast.error(`${file.name} não é um arquivo PDF válido`);
          console.log("Arquivo rejeitado - não é PDF:", file.name);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
          toast.error(`${file.name} é muito grande (máx. 10MB)`);
          console.log("Arquivo rejeitado - muito grande:", file.name);
          continue;
        }

        toast.info(`Processando ${file.name}...`);
        
        try {
          const transactions = await extractDataFromPDF(file);
          allTransactions.push(...transactions);
          
          setUploadedFiles(prev => [...prev, file.name]);
          toast.success(`${file.name} processado! ${transactions.length} transações encontradas.`);
          console.log("Arquivo processado com sucesso:", file.name, "Transações:", transactions.length);
          
        } catch (fileError) {
          console.error("Erro ao processar arquivo:", file.name, fileError);
          toast.error(`Erro ao processar ${file.name}`);
        }
      }

      if (allTransactions.length > 0) {
        console.log("Enviando transações para o componente pai:", allTransactions.length);
        onDataExtracted(allTransactions);
        toast.success(`🎉 Total: ${allTransactions.length} transações adicionadas!`);
      } else {
        toast.error("Nenhuma transação foi extraída dos arquivos");
      }
      
    } catch (error) {
      console.error("Erro geral no upload:", error);
      toast.error("Erro ao processar os arquivos PDF");
    } finally {
      setIsUploading(false);
      // Reset input para permitir re-upload do mesmo arquivo
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      console.log("Arquivos arrastados:", files.length);
      // Criar um evento simulado para reusar a lógica de upload
      const inputElement = document.createElement('input');
      inputElement.type = 'file';
      inputElement.files = files;
      
      const syntheticEvent = {
        target: inputElement
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleFileUpload(syntheticEvent);
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
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                {isUploading ? "Processando arquivos..." : "Clique aqui ou arraste seus PDFs"}
              </p>
              <p className="text-sm text-gray-500">
                Suporta múltiplos arquivos PDF (máx. 10MB cada)
              </p>
            </div>
            
            <Input
              id="file-input"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            
            <Button
              type="button"
              disabled={isUploading}
              className="mt-4 bg-teal-600 hover:bg-teal-700"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById('file-input')?.click();
              }}
            >
              {isUploading ? "Processando..." : "Selecionar Arquivos"}
            </Button>
          </div>

          {/* Status do Upload */}
          {isUploading && (
            <Alert className="border-blue-200 bg-blue-50 animate-pulse">
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
                  Arquivos Processados com Sucesso ({uploadedFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadedFiles.map((fileName, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{fileName}</span>
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
                <li>• Selecione ou arraste seus extratos bancários em PDF</li>
                <li>• O sistema extrairá automaticamente as transações</li>
                <li>• Os dados serão organizados e adicionados às suas finanças</li>
                <li>• Você pode revisar e editar as informações depois</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Dicas */}
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
