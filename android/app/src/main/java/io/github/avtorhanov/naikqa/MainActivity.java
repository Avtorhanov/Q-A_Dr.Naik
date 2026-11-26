package io.github.avtorhanov.naikqa;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Одно окно WebView с веб-приложением из assets/www.
 *
 * Страница отдаётся с адреса https://appassets.androidplatform.net/ (файлы берутся из APK, в сеть запрос не уходит).
 * Так у страницы есть обычный https-адрес: YouTube, Rutube и OK разрешают встраивать плеер только таким страницам.
 *
 * Ссылки на страницы источников открываются во встроенном окне поверх приложения (кнопка «✕» или «Назад» его закрывает).
 * Так ролик, который нельзя встроить в карточку, всё равно смотрится внутри приложения, плеером самого источника.
 * В браузер уходят только документы (PDF и т. п.) и ссылки не на сайты.
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    private static final int PICK_FILE = 7;
    private static final int FILL = FrameLayout.LayoutParams.MATCH_PARENT;

    private FrameLayout rootView;
    private WebView web;
    private View fullView;
    private WebChromeClient.CustomViewCallback fullCallback;
    private ValueCallback<Uri[]> fileCallback;
    private int barsFlags = 0;
    private int barsColor = 0xFF121815;
    private boolean barsDark = true;

    // Встроенное окно для страниц источников
    private LinearLayout viewer;
    private WebView viewerWeb;
    private TextView viewerTitle;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);

        rootView = new FrameLayout(this);
        web = new WebView(this);
        rootView.addView(web, new FrameLayout.LayoutParams(FILL, FILL));
        setContentView(rootView);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        web.addJavascriptInterface(new Bridge(), "AndroidApp");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());

        if (saved == null || web.restoreState(saved) == null) {
            web.loadUrl(START);
        }
    }

    /** Страница сообщает цвет фона темы, а приложение красит под него системные панели. */
    public final class Bridge {
        @JavascriptInterface
        public void setBars(final String color, final boolean dark) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    applyBars(color, dark);
                }
            });
        }

        /** Открыть страницу источника во встроенном окне (ролик, который нельзя встроить в карточку). */
        @JavascriptInterface
        public void openViewer(final String url) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (url != null) {
                        openInside(Uri.parse(url));
                    }
                }
            });
        }
    }

    private void applyBars(String color, boolean dark) {
        int c;
        try {
            c = Color.parseColor(color);
        } catch (IllegalArgumentException e) {
            return;
        }
        barsColor = c;
        barsDark = dark;
        paintViewer();
        Window w = getWindow();
        w.setStatusBarColor(c);
        w.setNavigationBarColor(c);
        rootView.setBackgroundColor(c);
        int flags = 0;
        if (!dark) {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
        }
        barsFlags = flags;
        if (fullView == null) {
            w.getDecorView().setSystemUiVisibility(flags);
        }
    }

    private class Client extends WebViewClient {

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri u = request.getUrl();
            if (!HOST.equals(u.getHost())) {
                return null; // всё остальное (плеер, шрифты) идёт в сеть как обычно
            }
            String path = u.getPath();
            if (path == null || path.isEmpty() || "/".equals(path)) {
                path = "/index.html";
            }
            if (path.contains("..")) {
                return notFound();
            }
            try {
                InputStream in = getAssets().open("www" + path);
                String mime = mimeOf(path);
                boolean text = mime.startsWith("text/") || mime.contains("json") || mime.contains("javascript") || mime.contains("svg");
                WebResourceResponse res = new WebResourceResponse(mime, text ? "utf-8" : null, in);
                Map<String, String> headers = new HashMap<>();
                headers.put("Cache-Control", "no-store");
                res.setResponseHeaders(headers);
                return res;
            } catch (IOException e) {
                return notFound();
            }
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri u = request.getUrl();
            if (!request.isForMainFrame() || HOST.equals(u.getHost())) {
                return false; // само приложение и встроенный плеер остаются внутри
            }
            if (isWeb(u) && !isDocument(u)) {
                openInside(u); // страница источника — во встроенном окне
            } else {
                openOutside(u); // документы и прочие ссылки — в браузере или приложении
            }
            return true;
        }
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found",
                new HashMap<String, String>(), new ByteArrayInputStream(new byte[0]));
    }

    private static String mimeOf(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js")) return "text/javascript";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".webmanifest")) return "application/manifest+json";
        return "application/octet-stream";
    }

    private static boolean isWeb(Uri u) {
        String sc = u.getScheme();
        return "https".equalsIgnoreCase(sc) || "http".equalsIgnoreCase(sc);
    }

    private static boolean isDocument(Uri u) {
        String p = u.getPath() == null ? "" : u.getPath().toLowerCase();
        return p.endsWith(".pdf") || p.endsWith(".doc") || p.endsWith(".docx") || p.endsWith(".zip") || p.endsWith(".apk")
                || p.endsWith(".epub") || p.endsWith(".djvu");
    }

    private int dp(int v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private TextView barButton(String text, String description) {
        TextView b = new TextView(this);
        b.setText(text);
        b.setContentDescription(description);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        b.setGravity(Gravity.CENTER);
        b.setMinWidth(dp(48));
        b.setPadding(dp(12), 0, dp(12), 0);
        b.setClickable(true);
        b.setFocusable(true);
        TypedValue ripple = new TypedValue();
        if (getTheme().resolveAttribute(android.R.attr.selectableItemBackground, ripple, true)) {
            b.setBackgroundResource(ripple.resourceId);
        }
        return b;
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void buildViewer() {
        viewer = new LinearLayout(this);
        viewer.setOrientation(LinearLayout.VERTICAL);
        viewer.setClickable(true); // нажатия не проходят к приложению под окном

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);

        TextView close = barButton("✕", "Закрыть");
        close.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                closeViewer();
            }
        });
        viewerTitle = new TextView(this);
        viewerTitle.setSingleLine(true);
        viewerTitle.setEllipsize(TextUtils.TruncateAt.END);
        viewerTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        TextView outside = barButton("Браузер ↗", "Открыть в браузере");
        outside.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        outside.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String url = viewerWeb == null ? null : viewerWeb.getUrl();
                if (url != null && url.startsWith("http")) {
                    openOutside(Uri.parse(url));
                }
            }
        });
        bar.addView(close, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, dp(52)));
        bar.addView(viewerTitle, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        bar.addView(outside, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, dp(52)));
        viewer.addView(bar, new LinearLayout.LayoutParams(FILL, LinearLayout.LayoutParams.WRAP_CONTENT));

        viewerWeb = new WebView(this);
        WebSettings s = viewerWeb.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        viewerWeb.setWebViewClient(new ViewerClient());
        viewerWeb.setWebChromeClient(new Chrome());
        viewerWeb.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String disposition, String mime, long length) {
                openOutside(Uri.parse(url)); // файлы скачивает браузер
            }
        });
        viewer.addView(viewerWeb, new LinearLayout.LayoutParams(FILL, 0, 1f));

        rootView.addView(viewer, new FrameLayout.LayoutParams(FILL, FILL));
        paintViewer();
    }

    /** Окно в цветах текущей темы приложения. */
    private void paintViewer() {
        if (viewer == null) {
            return;
        }
        viewer.setBackgroundColor(barsColor);
        int text = barsDark ? 0xFFE8EEE9 : 0xFF1B231E;
        viewerTitle.setTextColor(text);
        View bar = viewer.getChildAt(0);
        if (bar instanceof LinearLayout) {
            LinearLayout l = (LinearLayout) bar;
            for (int i = 0; i < l.getChildCount(); i++) {
                View c = l.getChildAt(i);
                if (c instanceof TextView) {
                    ((TextView) c).setTextColor(text);
                }
            }
        }
    }

    private void openInside(Uri u) {
        if (!isWeb(u) || isDocument(u)) {
            openOutside(u);
            return;
        }
        if (viewer == null) {
            buildViewer();
        }
        viewer.setVisibility(View.VISIBLE);
        viewerTitle.setText(u.getHost());
        viewerWeb.loadUrl(u.toString());
    }

    /** Закрыть окно и остановить звук: WebView окна уничтожается, при следующем открытии создаётся новый. */
    private void closeViewer() {
        if (viewer == null) {
            return;
        }
        if (fullView != null) {
            exitFullscreen();
        }
        rootView.removeView(viewer);
        viewerWeb.stopLoading();
        viewerWeb.destroy();
        viewer = null;
        viewerWeb = null;
        viewerTitle = null;
    }

    private class ViewerClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri u = request.getUrl();
            if (!isWeb(u) || isDocument(u)) {
                openOutside(u); // intent:, market:, документы — во внешнем приложении
                return true;
            }
            return false;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            if (viewerTitle != null && view == viewerWeb) {
                String title = view.getTitle();
                viewerTitle.setText(title != null && !title.isEmpty() && !title.startsWith("http") ? title : Uri.parse(url).getHost());
            }
        }
    }

    private void openOutside(Uri u) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, u).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (ActivityNotFoundException e) {
            // на устройстве нет приложения, которое открывает такие ссылки
        }
    }

    private class Chrome extends WebChromeClient {

        // Видео на весь экран
        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            if (fullView != null) {
                callback.onCustomViewHidden();
                return;
            }
            fullView = view;
            fullCallback = callback;
            rootView.addView(view, new FrameLayout.LayoutParams(FILL, FILL));
            web.setVisibility(View.GONE);
            if (viewer != null) {
                viewer.setVisibility(View.GONE);
            }
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }

        @Override
        public void onHideCustomView() {
            exitFullscreen();
        }

        // Выбор файла private_texts.json в разделе «О проекте»
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) {
                fileCallback.onReceiveValue(null);
            }
            fileCallback = callback;
            try {
                startActivityForResult(params.createIntent(), PICK_FILE);
            } catch (ActivityNotFoundException e) {
                fileCallback = null;
                return false;
            }
            return true;
        }
    }

    private void exitFullscreen() {
        if (fullView == null) {
            return;
        }
        rootView.removeView(fullView);
        fullView = null;
        web.setVisibility(View.VISIBLE);
        if (viewer != null) {
            viewer.setVisibility(View.VISIBLE);
        }
        if (fullCallback != null) {
            fullCallback.onCustomViewHidden();
            fullCallback = null;
        }
        getWindow().getDecorView().setSystemUiVisibility(barsFlags);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != PICK_FILE || fileCallback == null) {
            return;
        }
        fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
        fileCallback = null;
    }

    @Override
    public void onBackPressed() {
        if (fullView != null) {
            exitFullscreen();
        } else if (viewer != null) {
            if (viewerWeb.canGoBack()) {
                viewerWeb.goBack();
            } else {
                closeViewer();
            }
        } else if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onPause() {
        web.onPause(); // запись не играет, пока приложение свёрнуто
        if (viewerWeb != null) {
            viewerWeb.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        if (viewerWeb != null) {
            viewerWeb.onResume();
        }
    }

    @Override
    protected void onDestroy() {
        closeViewer();
        rootView.removeView(web);
        web.destroy();
        super.onDestroy();
    }
}
