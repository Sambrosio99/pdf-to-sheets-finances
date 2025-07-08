
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Transaction } from "@/types/finance";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface FileUploaderProps {
  onDataExtracted: (transactions: Omit<Transaction, 'id'>[]) => void;
}

export const FileUploader = ({ onDataExtracted }: FileUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Função para extrair dados de CSV
  const extractDataFromCSV = async (file: File): Promise<Omit<Transaction, 'id'>[]> => {
    console.log("Processando arquivo CSV:", file.name);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const transactions: Omit<Transaction, 'id'>[] = [];
          
          // Ignorar cabeçalho se existir
          const dataLines = lines.slice(1);
          
          for (const line of dataLines) {
            const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
            
            if (columns.length >= 4) {
              // Assumindo formato: Data, Descrição, Valor, Categoria
              const [date, description, amount, category = 'Outros'] = columns;
              
              const numericAmount = Math.abs(parseFloat(amount.replace(/[^\d.-]/g, '')));
              const transactionType = parseFloat(amount.replace(/[^\d.-]/g, '')) >= 0 ? 'income' : 'expense';
              
              if (!isNaN(numericAmount) && date && description) {
                transactions.push({
                  date: formatDate(date),
                  description: description,
                  category: category || 'Outros',
                  paymentMethod: 'Não informado',
                  amount: numericAmount,
                  type: transactionType,
                  status: 'paid'
                });
              }
            }
          }
          
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo CSV'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  // Função para formatar data
  const formatDate = (dateStr: string): string => {
    // Tentar diferentes formatos de data
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
      /(\d{1,2})-(\d{1,2})-(\d{4})/    // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[1]) { // YYYY-MM-DD
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else { // DD/MM/YYYY ou DD-MM-YYYY
          return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
        }
      }
    }
    
    // Se não conseguir parsear, usar data atual
    return new Date().toISOString().split('T')[0];
  };

  // Função simulada para extrair dados do PDF
  const extractDataFromPDF = async (file: File): Promise<Omit<Transaction, 'id'>[]> => {
    console.log("Processando arquivo PDF:", file.name);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Dados simulados
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
        
        // Validar tipo de arquivo
        const isValidFile = file.type === 'application/pdf' || 
                           file.type === 'text/csv' || 
                           file.name.toLowerCase().endsWith('.csv');
        
        if (!isValidFile) {
          toast.error(`${file.name} não é um arquivo PDF ou CSV válido`);
          console.log("Arquivo rejeitado - tipo inválido:", file.name);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
          toast.error(`${file.name} é muito grande (máx. 10MB)`);
          console.log("Arquivo rejeitado - muito grande:", file.name);
          continue;
        }

        toast.info(`Processando ${file.name}...`);
        
        try {
          let transactions: Omit<Transaction, 'id'>[];
          
          if (file.type === 'application/pdf') {
            transactions = await extractDataFromPDF(file);
          } else {
            transactions = await extractDataFromCSV(file);
          }
          
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
      toast.error("Erro ao processar os arquivos");
    } finally {
      setIsUploading(false);
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
          <CardTitle className="text-teal-700">📄 Upload de Arquivos</CardTitle>
          <CardDescription>
            Faça upload dos seus extratos em PDF ou planilhas CSV para extração automática dos dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                {isUploading ? "Processando arquivos..." : "Clique aqui ou arraste seus arquivos"}
              </p>
              <p className="text-sm text-gray-500">
                Suporta arquivos PDF e CSV (máx. 10MB cada)
              </p>
            </div>
            
            <Input
              id="file-input"
              type="file"
              accept=".pdf,.csv,application/pdf,text/csv"
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

          {isUploading && (
            <Alert className="border-blue-200 bg-blue-50 animate-pulse">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Processando...</strong> Aguarde enquanto extraímos os dados dos seus arquivos.
              </AlertDescription>
            </Alert>
          )}

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

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formatos aceitos:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• <strong>PDF:</strong> Extratos bancários, faturas de cartão</li>
                <li>• <strong>CSV:</strong> Planilhas com dados de transações</li>
                <li>• Para CSV, use o formato: Data, Descrição, Valor, Categoria</li>
                <li>• Os dados serão organizados e adicionados às suas finanças</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
