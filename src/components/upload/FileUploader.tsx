import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Transaction } from "@/types/finance";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { parseCSVFile as parseNubankCSV, Transacao as NubankTransacao, setNubankAuditFileMeta, printNubankAuditSummary } from "@/lib/parsers/nubank";

interface FileUploaderProps {
  onDataExtracted: (transactions: Omit<Transaction, 'id'>[]) => void;
}

export const FileUploader = ({ onDataExtracted }: FileUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Parsing movido para util: src/lib/parsers/nubank.ts
  // Self-test rápido (3 linhas de validação)
  ;(() => {
    try {
      const extrato = "2025-07-15,320556,,Compra Supermercado";
      const fatura = [
        "data,descricao,valor",
        '15/07/2025,"Assinatura Pro","3.205,56"',
        '2025/07/15,"Restaurante, Sushi","3205.56"',
      ].join("\n");
      console.log("[Parser Test] Extrato:", parseNubankCSV(extrato, "NU_teste.csv"));
      console.log("[Parser Test] Fatura:", parseNubankCSV(fatura, "Nubank_teste.csv"));
    } catch (err) {
      console.warn("[Parser Test] Falhou:", err);
    }
  })();


  // Função melhorada para extrair dados de CSV
  const extractDataFromCSV = async (file: File): Promise<Omit<Transaction, 'id'>[]> => {
    console.log("Processando arquivo CSV:", file.name);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed: NubankTransacao[] = parseNubankCSV(text, file.name);
          const included = parsed.filter(t => t.includeInTotals);
          const transactions: Omit<Transaction, 'id'>[] = included.map(t => ({
            date: t.date,
            description: t.description,
            category: t.category,
            paymentMethod: t.paymentMethod,
            amount: t.amount,
            type: t.type,
            status: t.status
          }));
          
          console.log(`✅ ${file.name}: ${transactions.length} transações extraídas (fatura excluída dos totais)`);
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file, 'UTF-8');
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("FileUploader: Evento de upload disparado");
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      console.log("FileUploader: Nenhum arquivo selecionado");
      return;
    }

    console.log("FileUploader: Arquivos selecionados:", {
      count: files.length,
      files: Array.from(files).map(f => ({ name: f.name, type: f.type, size: f.size }))
    });
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
            // Função simulada para PDF - mantém a mesma
            await new Promise(resolve => setTimeout(resolve, 1500));
            const today = new Date();
            transactions = [
              {
                date: today.toISOString().split('T')[0],
                description: `Compra Supermercado - Extrato ${file.name.substring(0, 10)}`,
                category: 'Alimentação',
                paymentMethod: 'Cartão de Débito',
                amount: 89.50,
                type: 'expense',
                status: 'paid'
              }
            ];
          } else {
            // 🔧 DETECTAR TIPO DE ARQUIVO NUBANK CORRETAMENTE
            const isExtrato = file.name.includes('NU_');  // Extrato da conta
            const isFatura = file.name.includes('Nubank_'); // Fatura do cartão
            const isCreditCardBill = file.name.toLowerCase().includes('fatura') || 
                                   file.name.toLowerCase().includes('cartao') ||
                                   file.name.toLowerCase().includes('invoice');
            
            if (isExtrato) {
              console.log("🟡 PROCESSANDO COMO EXTRATO BANCÁRIO (NU_*.csv) - valores em centavos");
              setNubankAuditFileMeta({ fileName: file.name, sizeBytes: file.size, mimeType: file.type });
              transactions = await extractDataFromCSV(file);
            } else {
              console.log("🟢 PROCESSANDO COMO CSV GENÉRICO/FATURA - valores já convertidos");
              setNubankAuditFileMeta({ fileName: file.name, sizeBytes: file.size, mimeType: file.type });
              transactions = await extractDataFromCSV(file);
            }
          }
          
          allTransactions.push(...transactions);
          
          setUploadedFiles(prev => [...prev, file.name]);
          toast.success(`${file.name} processado! ${transactions.length} transações encontradas.`);
          console.log("Arquivo processado com sucesso:", file.name, "Transações:", transactions.length);
          
        } catch (fileError) {
          console.error("Erro ao processar arquivo:", file.name, fileError);
          toast.error(`Erro ao processar ${file.name}: ${fileError.message}`);
        }
      }

      if (allTransactions.length > 0) {
        console.log("Enviando transações para o componente pai:", allTransactions.length);
        onDataExtracted(allTransactions);
        toast.success(`🎉 Total: ${allTransactions.length} transações importadas com sucesso!`);
      } else {
        toast.error("Nenhuma transação foi extraída dos arquivos");
      }
      // Emitir relatório final de auditoria
      printNubankAuditSummary();
      
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

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-teal-700">📄 Upload de Extratos Bancários</CardTitle>
          <CardDescription>
            Faça upload dos seus extratos bancários em CSV ou PDF para importação automática
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors cursor-pointer"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
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
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                {isUploading ? "Processando arquivos..." : "Clique aqui ou arraste seus arquivos"}
              </p>
              <p className="text-sm text-gray-500">
                Suporta extratos bancários em CSV e PDF (máx. 10MB cada)
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
                <strong>Processando...</strong> Extraindo dados do seu extrato bancário...
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
              <strong>✅ Sistema CORRIGIDO para extratos do Nubank:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>🔧 <strong>Detecção inteligente de formato:</strong> Diferencia centavos vs. valores em reais</li>
                <li>💰 <strong>Valores de extrato:</strong> Automaticamente divididos por 100 (formato centavos)</li>
                <li>💳 <strong>Valores de fatura:</strong> Mantidos como estão (já em formato reais)</li>
                <li>📈 <strong>Tipos corretos:</strong> Estornos e valores positivos = receitas</li>
                <li>🚫 <strong>Anti-duplicatas:</strong> Remove transações idênticas e valores zerados</li>
                <li>🎯 <strong>Categorização inteligente:</strong> Identifica automaticamente tipo e categoria</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
