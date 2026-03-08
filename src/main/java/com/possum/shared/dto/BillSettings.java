package com.possum.shared.dto;

public class BillSettings {

    private boolean showLogo = true;
    private int paperWidth = 80;
    private String footerNote = "";

    public boolean isShowLogo() {
        return showLogo;
    }

    public void setShowLogo(boolean showLogo) {
        this.showLogo = showLogo;
    }

    public int getPaperWidth() {
        return paperWidth;
    }

    public void setPaperWidth(int paperWidth) {
        this.paperWidth = paperWidth;
    }

    public String getFooterNote() {
        return footerNote;
    }

    public void setFooterNote(String footerNote) {
        this.footerNote = footerNote;
    }
}
