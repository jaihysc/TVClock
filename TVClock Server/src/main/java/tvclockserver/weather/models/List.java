package tvclockserver.weather.models;

public class List {
    private long dt;
    private MainClass main;
    private Weather[] weather;
    private Clouds clouds;
    private Wind wind;
    private Sys sys;
    private String dtTxt;
    private Rain rain;
    private Snow snow;

    public long getDt() { return dt; }
    public void setDt(long value) { this.dt = value; }

    public MainClass getMain() { return main; }
    public void setMain(MainClass value) { this.main = value; }

    public Weather[] getWeather() { return weather; }
    public void setWeather(Weather[] value) { this.weather = value; }

    public Clouds getClouds() { return clouds; }
    public void setClouds(Clouds value) { this.clouds = value; }

    public Wind getWind() { return wind; }
    public void setWind(Wind value) { this.wind = value; }

    public Sys getSys() { return sys; }
    public void setSys(Sys value) { this.sys = value; }

    public String getDtTxt() { return dtTxt; }
    public void setDtTxt(String value) { this.dtTxt = value; }

    public Rain getRain() { return rain; }
    public void setRain(Rain value) { this.rain = value; }

    public Snow getSnow() { return snow; }
    public void setSnow(Snow snow) { this.snow = snow; }
}
