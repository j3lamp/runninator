module.exports = function scopedAction(
    opening,
    close
)
{
    return function(
        body
    )
    {
        var result;

        result = opening();

        try
        {
            body(result);
        }
        finally
        {
            return close();
        }
    }
}
