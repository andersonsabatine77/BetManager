import java.nio.channels.Pipe;
public class Test {
    public static void main(String[] a) throws Exception {
        System.out.println("Provider: " + java.nio.channels.spi.SelectorProvider.provider().getClass().getName());
        Pipe p = Pipe.open();
        System.out.println("Pipe OK");
        p.sink().close(); p.source().close();
    }
}
