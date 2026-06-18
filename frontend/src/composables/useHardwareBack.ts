import { onMounted, onBeforeUnmount } from "vue";
import { f7, f7ready } from "framework7-vue";
import { useBackButton } from "./useBackButton";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

let lastTimeBackButtonWasPressed = 0;

export function useHardwareBack() {
  const { handlers } = useBackButton();

  onMounted(() => {
    f7ready(async () => {
      if (!Capacitor.isNativePlatform()) return;

      // Register Capacitor Back Button Listener
      await CapacitorApp.addListener("backButton", async () => {
        try {
          const $ = f7.$;

          // 1. Close Open overlays (Action sheet, Dialog, Sheet, Popup, Popover, Panels)
          if ($(".actions-modal.modal-in").length) {
            f7.actions.close(".actions-modal.modal-in");
            return;
          }
          if ($(".dialog.modal-in").length) {
            f7.dialog.close(".dialog.modal-in");
            return;
          }
          if ($(".sheet-modal.modal-in").length) {
            f7.sheet.close(".sheet-modal.modal-in");
            return;
          }
          if ($(".popover.modal-in").length) {
            f7.popover.close(".popover.modal-in");
            return;
          }
          if ($(".popup.modal-in").length) {
            f7.popup.close(".popup.modal-in");
            return;
          }
          if ($(".panel-left.panel-in, .panel-right.panel-in").length) {
            f7.panel.close();
            return;
          }

          // 2. Custom page-level handlers (e.g. confirm exit dialog shown)
          for (const registered of handlers.value) {
            const wasHandled = await registered.handler();
            if (wasHandled) {
              return;
            }
          }

          // 3. Router navigation (Framework7 Router pop)
          let activeView = f7.views.current;
          const activeTabEl = $(".view.tab-active")[0];
          if (activeTabEl) {
            activeView = f7.views.get(activeTabEl) || activeView;
          }
          if (!activeView && f7.views.main) {
            activeView = f7.views.main;
          }

          const router = activeView?.router;

          if (router && router.history.length > 1) {
            router.back();
          }
          // 4. Double tap to exit if at root page
          else {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - lastTimeBackButtonWasPressed;

            if (timeDiff < 2000) {
              CapacitorApp.exitApp();
            } else {
              lastTimeBackButtonWasPressed = currentTime;
              f7.toast
                .create({
                  text: "Tekan kembali sekali lagi untuk keluar",
                  position: "bottom",
                  closeTimeout: 2000,
                })
                .open();
            }
          }
        } catch (error) {
          console.error("[HardwareBack] Error handling hardware back button:", error);
        }
      });
    });
  });

  onBeforeUnmount(() => {
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.removeAllListeners();
    }
  });
}
