package app.lovable.financeirohugo;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationListener")
public class NotificationListenerPlugin extends Plugin {

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = isNotificationServiceEnabled();
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (!isNotificationServiceEnabled()) {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            getActivity().startActivity(intent);
        }
        
        JSObject ret = new JSObject();
        ret.put("granted", isNotificationServiceEnabled());
        call.resolve(ret);
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (isNotificationServiceEnabled()) {
            // O serviço já está ativo, notificar para começar a escutar
            NotificationListenerService.setPluginInstance(this);
            call.resolve();
        } else {
            call.reject("Notification access permission not granted");
        }
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        NotificationListenerService.setPluginInstance(null);
        call.resolve();
    }

    private boolean isNotificationServiceEnabled() {
        ComponentName cn = new ComponentName(getContext(), NotificationListenerService.class);
        String flat = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
        return !TextUtils.isEmpty(flat) && flat.contains(cn.flattenToString());
    }

    public void notifyNotificationReceived(String title, String body, String packageName, long timestamp) {
        JSObject notification = new JSObject();
        notification.put("title", title);
        notification.put("body", body);
        notification.put("packageName", packageName);
        notification.put("timestamp", timestamp);
        
        notifyListeners("notificationReceived", notification);
    }
}