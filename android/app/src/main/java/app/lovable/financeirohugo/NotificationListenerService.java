package app.lovable.financeirohugo;

import android.app.Notification;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import java.util.Arrays;
import java.util.List;

public class NotificationListenerService extends NotificationListenerService {
    private static final String TAG = "NotificationListener";
    private static NotificationListenerPlugin pluginInstance;
    
    // Pacotes dos bancos que queremos monitorar
    private static final List<String> BANK_PACKAGES = Arrays.asList(
        "com.nu.production",     // Nubank
        "com.bradesco",          // Bradesco
        "com.bradesco.next",     // Bradesco Next
        "br.com.bradesco"        // Bradesco alternativo
    );

    public static void setPluginInstance(NotificationListenerPlugin plugin) {
        pluginInstance = plugin;
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (pluginInstance == null) {
            return;
        }

        String packageName = sbn.getPackageName();
        
        // Filtrar apenas notificações de bancos
        if (!BANK_PACKAGES.contains(packageName)) {
            return;
        }

        Notification notification = sbn.getNotification();
        if (notification == null) {
            return;
        }

        // Extrair título e texto da notificação
        String title = "";
        String body = "";
        
        if (notification.extras != null) {
            CharSequence titleSeq = notification.extras.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence textSeq = notification.extras.getCharSequence(Notification.EXTRA_TEXT);
            
            if (titleSeq != null) {
                title = titleSeq.toString();
            }
            
            if (textSeq != null) {
                body = textSeq.toString();
            }
        }

        // Log para debug
        Log.d(TAG, "Notification from " + packageName + ": " + title + " - " + body);

        // Verificar se contém informações de transação
        if (isTransactionNotification(title, body)) {
            long timestamp = sbn.getPostTime();
            pluginInstance.notifyNotificationReceived(title, body, packageName, timestamp);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Não precisamos fazer nada quando uma notificação é removida
    }

    private boolean isTransactionNotification(String title, String body) {
        String fullText = (title + " " + body).toLowerCase();
        
        // Palavras-chave que indicam transações financeiras
        String[] transactionKeywords = {
            "compra", "pagamento", "pix", "transferência", "saque", "depósito",
            "débito", "crédito", "fatura", "cartão", "conta", "real", "r$",
            "aprovado", "recebido", "enviado", "cobrado"
        };
        
        for (String keyword : transactionKeywords) {
            if (fullText.contains(keyword)) {
                return true;
            }
        }
        
        return false;
    }
}